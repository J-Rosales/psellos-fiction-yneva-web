import type { GridPaginationModel } from '@mui/x-data-grid';

export function buildEntitiesPaginationParams(input: {
  currentSearch: string;
  currentModel: GridPaginationModel;
  nextModel: GridPaginationModel;
}): URLSearchParams {
  const params = new URLSearchParams(input.currentSearch);
  const nextPage = input.nextModel.pageSize !== input.currentModel.pageSize ? 0 : input.nextModel.page;
  params.set('page', String(nextPage));
  params.set('page_size', String(input.nextModel.pageSize));
  return params;
}
