import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, type MutationFunction, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { structureApi } from '../api/structure-api';
import { employeeKeys } from './query-keys';

export const useCompanyStructure = (): UseQueryResult<{ departments: components['schemas']['Department_Output'][] }> =>
    useQuery({ queryKey: employeeKeys.structure(), queryFn: structureApi.find });

export const HOLDERS_PAGE_SIZE = 5;

/** Who holds a position, five a page; another page keeps the current one until it arrives. */
export const usePositionHolders = (
    positionId: string,
    page: number,
): UseQueryResult<{ content: components['schemas']['EmployeeListItem_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: employeeKeys.positionHolders(positionId, page),
        queryFn: () => structureApi.holders(positionId, page, HOLDERS_PAGE_SIZE),
        placeholderData: keepPreviousData,
    });

/**
 * Every change re-reads everything about employees — the structure, the position picker, the
 * Employees tabs and lists (a renamed position shows everywhere) — and Insights, grouped by
 * department.
 */
const useStructureMutation = <TResult, TVariables>(mutationFn: MutationFunction<TResult, TVariables>) => {
    const queryClient = useQueryClient();
    return useMutation<TResult, ApiError, TVariables>({
        mutationFn,
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
                queryClient.invalidateQueries({ queryKey: ['insights'] }),
            ]);
        },
    });
};

export const useCreateDepartment = (): UseMutationResult<
    { id: string; name: string; positions: components['schemas']['StructurePosition_Output'][]; version: number },
    ApiError,
    { name: string; idempotencyKey: string }
> =>
    useStructureMutation(({ name, idempotencyKey }: { name: string; idempotencyKey: string }) =>
        structureApi.createDepartment(name, idempotencyKey),
    );

export const useRenameDepartment = (): UseMutationResult<
    void,
    ApiError,
    { departmentId: string; name: string; version: number }
> =>
    useStructureMutation(({ departmentId, name, version }: { departmentId: string; name: string; version: number }) =>
        structureApi.renameDepartment(departmentId, name, version),
    );

export const useRemoveDepartment = (): UseMutationResult<void, ApiError, string> =>
    useStructureMutation((departmentId: string) => structureApi.removeDepartment(departmentId));

export const useCreatePosition = (): UseMutationResult<
    { id: string; title: string; employeeCount: number; isRemovable: boolean; version: number },
    ApiError,
    { departmentId: string; title: string; idempotencyKey: string }
> =>
    useStructureMutation(
        ({ departmentId, title, idempotencyKey }: { departmentId: string; title: string; idempotencyKey: string }) =>
            structureApi.createPosition(departmentId, title, idempotencyKey),
    );

export const useRenamePosition = (): UseMutationResult<
    void,
    ApiError,
    { positionId: string; title: string; version: number }
> =>
    useStructureMutation(({ positionId, title, version }: { positionId: string; title: string; version: number }) =>
        structureApi.renamePosition(positionId, title, version),
    );

export const useRemovePosition = (): UseMutationResult<void, ApiError, string> =>
    useStructureMutation((positionId: string) => structureApi.removePosition(positionId));
