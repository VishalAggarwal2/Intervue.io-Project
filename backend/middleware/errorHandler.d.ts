import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response) => void;
