import { Schema, model } from 'mongoose';

const SectionSchema = new Schema({
  heading: { type: String, required: true },
  content: { type: String, required: true },
  codeExamples: [{ type: String, required: false }]
}, { _id: false });

const ContentSchema = new Schema({
  intro: { type: String, required: true },
  sections: { type: [SectionSchema], required: true }
}, { _id: false });

const QuizQuestionSchema = new Schema({
  questionId: { type: String, required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const QuizSchema = new Schema({
  questions: { type: [QuizQuestionSchema], required: true }
}, { _id: false });

const ConceptSchema = new Schema({
  conceptId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  prerequisites: { type: [String], required: true }, // Array of conceptIds
  content: { type: ContentSchema, required: true },
  quiz: { type: QuizSchema, required: true },
  tags: { type: [String], required: true }
}, { timestamps: true });

export default model('Concept', ConceptSchema);
