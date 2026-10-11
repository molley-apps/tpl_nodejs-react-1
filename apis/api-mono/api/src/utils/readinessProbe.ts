import { NextFunction, Request, Response } from 'express';
import MongoConnectionService from '@/services/MongoConnectionService';

/**
 * Readiness endpoint for the Cloud Run startup probe.
 *
 * The distinction this exists to draw: `/health` is a LIVENESS check — it
 * returns `{ http: true }` and says only that express is answering. It is true
 * from the moment the port opens, which is BEFORE Mongo is connected (the port
 * is opened first deliberately; see server.ts). Pointing a startup probe at it
 * therefore admits traffic to a pod that cannot serve a single authenticated
 * request — every one of them dies on `sessions.findOne()` buffering out.
 *
 * `/readyz` answers the different question: can this pod do work? Wiring the
 * startup probe to it (`startup_probe_path = "/readyz"`) makes Cloud Run hold
 * traffic until Mongo is up, and route to a healthy pod meanwhile.
 *
 * Registered via `requestMiddlewareBefore`, so it runs ahead of the generated
 * routes and all the standard request middleware — no auth, no body parsing,
 * no DB call of its own. It reads connection STATE; it never issues a query,
 * which is what keeps it safe to poll every few seconds.
 */
export default function readinessProbe(req: Request, res: Response, next: NextFunction): void {
  if (req.path !== '/readyz') {
    next();
    return;
  }

  const mongoConnected = MongoConnectionService.isConnected;
  // 503 (not 500) — this is "not ready yet", a state the probe is expected to
  // poll through on a cold start, not an error.
  res.status(mongoConnected ? 200 : 503).json({ ready: mongoConnected, mongoConnected });
}
