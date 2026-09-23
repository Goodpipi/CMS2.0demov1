import {
  emptyPosterPlanB,
  type PosterPlanBState,
} from '@/lib/posterPlanBMocks';

export type PosterPlanCRoute = 'pending' | 'kv' | 'direct';

export interface PosterPlanCState extends PosterPlanBState {
  route: PosterPlanCRoute;
  view: 'list' | 'new';
}

export function emptyPosterPlanC(): PosterPlanCState {
  return {
    ...emptyPosterPlanB(),
    route: 'pending',
    view: 'list',
  };
}
