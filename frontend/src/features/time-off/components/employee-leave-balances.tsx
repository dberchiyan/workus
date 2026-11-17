import type { ReactElement } from 'react';

import { useEmployeeBalances } from '../hooks/use-time-off-queries';
import { LeaveBalanceCards } from './leave-balance-cards';

/** An employee's balances, stacked (profile side column, admin). */
export function EmployeeLeaveBalances({ employeeId }: { employeeId: string }): ReactElement {
    const balances = useEmployeeBalances(employeeId);
    return (
        <LeaveBalanceCards
            data={balances.data}
            isPending={balances.isPending}
            isError={balances.isError}
            onRetry={() => void balances.refetch()}
            headingLevel="h2"
            layout="column"
        />
    );
}
