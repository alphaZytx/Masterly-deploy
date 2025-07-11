import { Request, Response } from 'express';

export const getCourses = (req: Request, res: Response) => {
  res.json({ message: 'Courses placeholder' });
}; 