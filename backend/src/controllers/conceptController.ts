// src/controllers/conceptController.ts
import { Request, Response } from 'express';
import Concept from '../models/conceptModel';
import { getQuizQuestions } from '../utils/conceptMapper';

/**
 * @desc    Fetch all available learning concepts (course catalog).
 * @route   GET /api/concepts
 * @access  Private
 */
export const getAllConcepts = async (req: Request, res: Response) => {
    try {
        // Only select fields needed for a catalog view to keep the payload small.
        // Remove non-existent fields from select
        const concepts = await Concept.find({})
            .select('title description prerequisites')
            .populate('prerequisites', '_id title');
        console.log('Found concepts:', concepts.length);
        res.status(200).json(concepts);
    } catch (error) {
        console.error(String(error));
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Search concepts by title
 * @route   GET /api/concepts/search?q=query
 * @access  Private
 */
export const searchConcepts = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        
        console.log('Searching for concepts with query:', q);
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Remove non-existent fields from select
        const concepts = await Concept.find({
            title: { $regex: q, $options: 'i' }
        }).select('title description _id');

        console.log('Search results:', concepts.length, 'concepts found');
        res.status(200).json(concepts);
    } catch (error) {
        console.error(String(error));
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Test endpoint to check if concepts exist
 * @route   GET /api/concepts/test
 * @access  Public
 */
export const testConcepts = async (req: Request, res: Response) => {
    try {
        const count = await Concept.countDocuments();
        const sampleConcepts = await Concept.find({}).limit(5).select('title _id');
        
        res.status(200).json({
            totalConcepts: count,
            sampleConcepts: sampleConcepts,
            message: count > 0 ? 'Concepts found in database' : 'No concepts found in database'
        });
    } catch (error) {
        console.error('Test concepts error:', String(error));
        res.status(500).json({ message: 'Database error', error: (error as Error).message });
    }
};

/**
 * @desc    Test endpoint to check quiz functionality
 * @route   GET /api/concepts/test-quiz
 * @access  Public
 */
export const testQuiz = async (req: Request, res: Response) => {
    try {
        // Only check for quiz.questions (no Test_Questions or quiz as array)
        const conceptsWithQuiz = await Concept.find({
            'quiz.questions.0': { $exists: true }
        }).select('title _id quiz');
        
        res.status(200).json({
            conceptsWithQuiz: conceptsWithQuiz.length,
            sampleConcepts: conceptsWithQuiz.slice(0, 3).map(c => ({
                title: c.title,
                id: c._id,
                hasQuizQuestions: c.quiz && Array.isArray(c.quiz.questions) && c.quiz.questions.length > 0,
                quizQuestionsCount: c.quiz?.questions?.length || 0
            }))
        });
    } catch (error) {
        console.error('Test quiz error:', String(error));
        res.status(500).json({ message: 'Database error', error: (error as Error).message });
    }
};

/**
 * @desc    Fetch a single, detailed concept by its ID.
 * @route   GET /api/concepts/:id
 * @access  Private
 */
export const getConceptById = async (req: Request, res: Response) => {
    try {
        // Populate prerequisites to show their titles, creating the visible graph.
        const concept = await Concept.findById(req.params.id)
            .populate('prerequisites', 'title');
            
        if (concept) {
            res.status(200).json(concept);
        } else {
            res.status(404).json({ message: 'Concept not found' });
        }
    } catch (error) {
        console.error(String(error));
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get quiz questions for a specific concept
 * @route   GET /api/concepts/:id/quiz
 * @access  Private
 */
export const getConceptQuiz = async (req: Request, res: Response) => {
    try {
        const concept = await Concept.findById(req.params.id);
        
        if (!concept) {
            return res.status(404).json({ message: 'Concept not found' });
        }

        const quizQuestions =  getQuizQuestions(concept.toObject() as any)

        if (quizQuestions.length === 0) {
            return res.status(404).json({ message: 'No quiz questions found for this concept' });
        }

        res.status(200).json({
            conceptTitle: concept.title,
            conceptId: concept._id,
            questions: quizQuestions,
            totalQuestions: quizQuestions.length
        });
    } catch (error) {
        console.error(String(error));
        res.status(500).json({ message: 'Server Error' });
    }
};
