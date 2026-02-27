import { Request, Response } from 'express';
export declare const createRoom: (req: Request, res: Response) => Promise<void>;
export declare const getRoom: (req: Request, res: Response) => Promise<void>;
export declare const getStudentReport: (req: Request, res: Response) => Promise<void>;
export declare const getPollHistory: (req: Request, res: Response) => Promise<void>;
export declare const exportPollCSV: (req: Request, res: Response) => Promise<void>;
export declare const getTemplates: (_req: Request, res: Response) => Promise<void>;
export declare const saveTemplate: (req: Request, res: Response) => Promise<void>;
export declare const deleteTemplate: (req: Request, res: Response) => Promise<void>;
