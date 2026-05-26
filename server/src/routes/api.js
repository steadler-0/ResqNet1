import { Router } from 'express';
import {
  listEmergencies,
  getEmergency,
  saveEmergency,
  getResponder,
  saveResponder,
  listAvailableResponders,
} from '../store.js';
import {
  tryAcceptEmergency,
  updateResponderStatus,
  updateCitizenLocation,
  updateResponderLocation,
  RESPONDER_STATUSES,
} from '../services/emergencyService.js';
import { findNearbyResponders, rejectOffer } from '../services/matching.js';
import { syncEmergencyToFirebase } from '../services/firebase.js';
import { getOnlineResponderCount } from '../onlineRegistry.js';
import { broadcastSosToAll } from '../broadcastSos.js';

export function createApiRouter(io) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'rescuenet-api' });
  });

  router.get('/debug/online', async (_req, res) => {
    const sockets = await io.in('responders:pool').fetchSockets();
    res.json({
      poolRegistry: getOnlineResponderCount(),
      poolRoom: sockets.length,
      socketIds: sockets.map((s) => ({ id: s.id, responderId: s.data?.responderId })),
    });
  });

  router.get('/emergencies', (_req, res) => {
    res.json(listEmergencies());
  });

  router.get('/emergencies/:id', (req, res) => {
    const e = getEmergency(req.params.id);
    if (!e) return res.status(404).json({ error: 'not_found' });
    res.json(e);
  });

  router.post('/emergencies', async (req, res) => {
    try {
      const result = await broadcastSosToAll(io, req.body);
      if (!result.ok) return res.status(400).json(result);
      await syncEmergencyToFirebase(result.emergency);
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  router.patch('/emergencies/:id/location', async (req, res) => {
    const { latitude, longitude } = req.body;
    const updated = await updateCitizenLocation(
      req.params.id,
      latitude ?? req.body.lat,
      longitude ?? req.body.lng,
      io
    );
    if (!updated) return res.status(404).json({ error: 'not_found' });
    res.json(updated);
  });

  router.post('/emergencies/:id/accept', async (req, res) => {
    const { responderId } = req.body;
    if (!responderId) return res.status(400).json({ error: 'responder_id_required' });
    const result = await tryAcceptEmergency(req.params.id, responderId, io);
    if (!result.ok) return res.status(409).json(result);
    res.json(result);
  });

  router.post('/emergencies/:id/reject', (req, res) => {
    const { responderId } = req.body;
    if (!responderId) return res.status(400).json({ error: 'responder_id_required' });
    rejectOffer(req.params.id, responderId);
    res.json({ ok: true });
  });

  router.patch('/emergencies/:id/status', async (req, res) => {
    const { responderId, responderStatus } = req.body;
    const result = await updateResponderStatus(
      req.params.id,
      responderId,
      responderStatus,
      io
    );
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  });

  router.get('/emergencies/:id/nearby', (req, res) => {
    const e = getEmergency(req.params.id);
    if (!e) return res.status(404).json({ error: 'not_found' });
    res.json(findNearbyResponders(e.lat, e.lng, e.id));
  });

  router.get('/responders', (_req, res) => {
    res.json(listAvailableResponders());
  });

  router.get('/responders/:id', (req, res) => {
    const r = getResponder(req.params.id);
    if (!r) return res.status(404).json({ error: 'not_found' });
    res.json(r);
  });

  router.post('/responders/:id/heartbeat', async (req, res) => {
    const r = getResponder(req.params.id);
    if (!r) return res.status(404).json({ error: 'not_found' });
    const { lat, lng, available } = req.body;
    if (lat != null) r.lat = lat;
    if (lng != null) r.lng = lng;
    if (available !== undefined) {
      r.available = !!available;
      if (available) {
        r.activeEmergencyId = null;
        r.status = 'idle';
      }
    }
    r.lastSeen = new Date().toISOString();
    await saveResponder(r);
    if (lat != null && lng != null) {
      await updateResponderLocation(req.params.id, lat, lng, io);
    }
    res.json(r);
  });

  router.get('/meta/responder-statuses', (_req, res) => {
    res.json(RESPONDER_STATUSES);
  });

  return router;
}
