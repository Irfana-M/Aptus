import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { DomainEvent } from '../constants/events.js';

@injectable()
export class InternalEventEmitter extends EventEmitter {}

export const EVENTS = DomainEvent;
