import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export interface ChartTableProps {
  caption: string;
  columns: string[];
  rows: { key: string; cells: string[] }[];
}

/** The chart's numbers as a table — readable without colour (and in forced colours). */
export function ChartTable({ caption, columns, rows }: ChartTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table size="small">
        <caption className="sr-only">{caption}</caption>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={column} align={index === 0 ? 'left' : 'right'}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              {row.cells.map((cell, index) => (
                <TableCell
                  // Cells of one row share no stable id; their column is their identity.
                  key={columns[index] ?? index}
                  component={index === 0 ? 'th' : 'td'}
                  scope={index === 0 ? 'row' : undefined}
                  align={index === 0 ? 'left' : 'right'}
                  className="app-tabular"
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
