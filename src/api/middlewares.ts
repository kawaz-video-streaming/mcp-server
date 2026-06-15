import { NextFunction, Request, Response, UnauthorizedError } from '@ido_kawaz/server-framework';
import { isNil, isNotNil } from 'ramda';
import { decodeBasicAuth } from './utils';
import { createKawazMcpClient } from '../services/client/client';
import { KawazMcpConfig } from '../config';
import { RequestWithClient, Sessions } from './types';

export const createMcpAuthMiddleware = (sessions: Sessions, config: KawazMcpConfig) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const sessionId = req.headers["mcp-session-id"];
        if (isNotNil(sessionId) && typeof sessionId === "string") {
            const session = sessions.get(sessionId);
            if (isNil(session)) {
                next(new UnauthorizedError("Invalid session ID"));
                return;
            }
            await session.transport.handleRequest(req, res, req.body);
            return;
        }
        const auth = req.headers.authorization;
        const authCredentials = decodeBasicAuth(auth);
        if (isNil(authCredentials)) {
            next(new UnauthorizedError("Missing or invalid Authorization header"));
            return;
        }
        try {
            const client = await createKawazMcpClient(config, authCredentials);
            (req as RequestWithClient).client = client;
        } catch (err) {
            next(new UnauthorizedError("Invalid username or password"));
            return;
        }
        next();
    };