import { applyDecorators, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { InvalidParameterException } from '../exception/api.exception';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 100_000;

export type SortDirection = 'asc' | 'desc';

export interface Pageable<F extends string = string> {
  page: number;
  size: number;
  sort: { field: F; direction: SortDirection };
}

export interface PageableOptions<F extends string> {
  sortable: readonly F[];
  defaultSort: `${F},${SortDirection}`;
}

export const pageableOptions = <F extends string>(
  options: PageableOptions<F>,
): PageableOptions<F> => options;

const readSingle = (request: Request, name: string): string | undefined => {
  const value: unknown = request.query[name];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new InvalidParameterException(name);
  }
  return value;
};

const readInt = (request: Request, name: string, fallback: number, max: number): number => {
  const raw = readSingle(request, name);
  if (raw === undefined) {
    return fallback;
  }
  if (!/^\d{1,6}$/.test(raw) || Number(raw) > max) {
    throw new InvalidParameterException(name);
  }
  return Number(raw);
};

/** Parses `?page=0&size=20&sort=field,dir`; out-of-range or unknown values are 400, never clamped. */
const parsePageable = <F extends string>(
  options: PageableOptions<F>,
  request: Request,
): Pageable<F> => {
  const page = readInt(request, 'page', 0, MAX_PAGE);
  const size = readInt(request, 'size', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  if (size < 1) {
    throw new InvalidParameterException('size');
  }
  const [field, direction = 'asc'] = (readSingle(request, 'sort') ?? options.defaultSort).split(
    ',',
  );
  const sortField = options.sortable.find((candidate) => candidate === field);
  if (!sortField || (direction !== 'asc' && direction !== 'desc')) {
    throw new InvalidParameterException('sort');
  }
  return { page, size, sort: { field: sortField, direction } };
};

/** Binds the parsed page request (api.md → Pagination). */
export const PageableQuery = createParamDecorator(
  (options: PageableOptions<string>, context: ExecutionContext): Pageable =>
    parsePageable(options, context.switchToHttp().getRequest<Request>()),
);

/** Documents page, size and sort for a paginated handler. */
export const ApiPageable = <F extends string>(options: PageableOptions<F>): MethodDecorator =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      schema: { type: 'integer', minimum: 0, default: 0 },
    }),
    ApiQuery({
      name: 'size',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      description: `One of: ${options.sortable.map((field) => `${field},asc|desc`).join(', ')}`,
      schema: { type: 'string', default: options.defaultSort },
    }),
  );
