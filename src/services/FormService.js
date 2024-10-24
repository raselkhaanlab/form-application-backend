const mongoose = require("mongoose");
const FormModel = require('../model/Form');
const UserModel = require('../model/User');
const QuestionModel = require('../model/Question');
const ResponseModel = require('../model/Response');
const AnswerModel = require('../model/Answer');
const { ApiError } = require('../utils/ApiError');

module.exports = {
  getAllForms: async () => {
    return await FormModel.find()
      .populate('createdBy', 'name email')
      .populate('questions')
      .lean();
  },

  getFormsByUserId: async (userId) => {
    return await FormModel.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .lean();
  },

  createForm: async (formData) => {
    const { createdBy, name, description, questions } = formData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(createdBy).session(session);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const newForm = new FormModel({ createdBy, name, description });
      await newForm.save({ session });

      const createdQuestions = await QuestionModel.insertMany(
        questions.map((q) => ({ ...q, form: newForm._id })),
        { session }
      );

      newForm.questions = createdQuestions.map((q) => q._id);
      await newForm.save({ session });

      user.createdForms.push(newForm._id);
      await user.save({ session });

      await session.commitTransaction();
      return newForm;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  getFormById: async (formId) => {
    const form = await FormModel.findById(formId)
      .populate('questions')
      .populate('createdBy', 'name email')
      .lean();

    if (!form) {
      throw new ApiError(404, 'Form not found');
    }

    return form;
  },

  deleteFormById: async (formId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const questions = await QuestionModel.find({ form: formId }).session(session);
      const questionIds = questions.map(q => q._id);

      await AnswerModel.deleteMany({ question: { $in: questionIds } }, { session });
      await ResponseModel.deleteMany({ form: formId }, { session });
      await QuestionModel.deleteMany({ _id: { $in: questionIds } }, { session });
      await FormModel.deleteOne({ _id: formId }, { session });

      await session.commitTransaction();
      return { message: "Form deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  updateFormById: async (formId, data) => {
    const { questions = [], ...formData } = data;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedForm = await FormModel.findByIdAndUpdate(formId, formData, { new: true, session });
      const existingQuestions = await QuestionModel.find({ form: formId }).session(session);

      const newQuestions = questions.filter(q => !mongoose.Types.ObjectId.isValid(q._id));
      const existingQuestionUpdates = questions.filter(q => mongoose.Types.ObjectId.isValid(q._id));

      if (existingQuestionUpdates.length > 0) {
        await QuestionModel.bulkWrite(
          existingQuestionUpdates.map(q => ({
            updateOne: {
              filter: { _id: q._id },
              update: { $set: q }
            }
          })),
          { session }
        );
      }

      const addedQuestions = await QuestionModel.insertMany(
        newQuestions.map(q => ({ ...q, form: formId })),
        { session }
      );

      const inputQuestionIds = existingQuestionUpdates.map(q => q._id.toString());
      const questionsToRemove = existingQuestions.filter(
        q => !inputQuestionIds.includes(q._id.toString())
      );

      if (questionsToRemove.length > 0) {
        await QuestionModel.deleteMany({ _id: { $in: questionsToRemove.map(q => q._id) } }, { session });
      }

      updatedForm.questions = [...inputQuestionIds, ...addedQuestions.map(q => q._id)];
      await updatedForm.save({ session });

      await session.commitTransaction();
      return updatedForm;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  saveFormResponse: async (formId, data) => {
    const { userId, responses } = data;

    if (!Array.isArray(responses) || responses.length < 1) {
      throw new ApiError(400, 'Response should not be empty');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const questions = await QuestionModel.find({ form: formId }).session(session);

      if (!questions || questions.length < 1) {
        throw new ApiError(404, 'No questions found for the form');
      }

      const requiredQuestions = questions.filter(q => q.required);
      const answeredQuestions = responses.map(res => res.questionId);

      const missingRequiredQuestions = requiredQuestions
        .filter(q => !answeredQuestions.includes(q._id.toString()))
        .reduce((acc, q) => {
          acc[q._id.toString()] = `${q.text} is required`;
          return acc;
        }, {});

      if (Object.keys(missingRequiredQuestions).length > 0) {
        throw new ApiError(400, missingRequiredQuestions);
      }

      const newResponse = new ResponseModel({ form: formId, user: userId });
      await newResponse.save({ session });

      const answers = responses.map(res => ({
        response: newResponse._id,
        question: res.questionId,
        answer: res.answer,
      }));

      const savedAnswers = await AnswerModel.insertMany(answers, { session });
      
      newResponse.answers = savedAnswers.map(an => an._id.toString());
      await newResponse.save({ session });

      await session.commitTransaction();
      return newResponse;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  getAllFormResponses: async () => {
    return await ResponseModel.find()
      .populate('form', 'name')
      .populate('user', 'name email')
      .populate({
        path: 'answers',
        populate: { path: 'question' },
      })
      .lean();
  },
  getFromResponsesByFormId: async (formId) => {
    return await ResponseModel.find({ form: formId })
        .populate({
            path: 'answers',
            populate: { path: 'question', select: 'text' },
        })
        .populate('user', 'name email')
        .lean();
}
};