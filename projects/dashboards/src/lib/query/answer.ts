import { firstValueFrom, isObservable } from 'rxjs';
import { Answer } from '../contract/plugins';

/** A plug-in's answer as a promise, whichever form the project chose (an observable's first value). */
export function settle<T>(answer: Answer<T>): Promise<T> {
  return isObservable(answer) ? firstValueFrom(answer) : Promise.resolve(answer);
}
