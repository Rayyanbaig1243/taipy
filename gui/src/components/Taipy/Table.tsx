import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import Box from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { TableCellProps } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { format } from 'date-fns';

import { TaipyBaseProps } from "./utils";
import { TaipyContext } from "../../context/taipyContext";
import { createRequestTableUpdateAction } from "../../context/taipyReducers";

//import { useWhyDidYouUpdate } from "../../utils/hooks";

interface ColumnDesc {
    dfid: string;
    type: string; 
    format: string; 
    title?: string; 
    index: number;
}

interface TableProps extends TaipyBaseProps {
    pageSize?: number;
    /* eslint "@typescript-eslint/no-explicit-any": "off", curly: "error" */
    value: Record<string, Record<string, any>>;
    columns: string;
}

type Order = 'asc' | 'desc';

const getsortByIndex = (cols: Record<string, ColumnDesc>) => (key1: string, key2: string) => {
    if (cols[key1].index < cols[key2].index) {
        return -1;
      }
      if (cols[key1].index > cols[key2].index) {
        return 1;
      }
      return 0;
}

const defaultDateFormat = "yyyy/MM/dd";

const formatValue = (val: any, col: any) => {
    switch (col.type) {
        case "datetime64[ns]":
            return format(new Date(val), col.format || defaultDateFormat);
        default:
            return val;
    }
}

const alignCell = (col: any): Partial<TableCellProps> => {
    switch (col.type) {
        case "int64":
        case "float64":
            return {align: "right"};
        default:
            return {};
    }
}

const Table = (props: TableProps) => {
    const { className, id, tp_varname, pageSize = 100 } = props;
    const [value, setValue] = useState<Record<string, Record<string, unknown>>>({});
    const [startIndex, setStartIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);
    const { dispatch } = useContext(TaipyContext);
    const pageKey = useRef('no-page');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState<Order>('asc');

//    useWhyDidYouUpdate('TaipyTable', props);

    useEffect(() => {
        if (props.value && props.value[pageKey.current] !== undefined) {
            setValue(props.value[pageKey.current])
        }
    }, [props.value]);

    /* eslint react-hooks/exhaustive-deps: "off", curly: "error" */
    useEffect(() => {
        pageKey.current = `${startIndex}-${startIndex + pageSize}-${orderBy}-${order}`;
        if (!props.value || props.value[pageKey.current] === undefined) {
            dispatch(createRequestTableUpdateAction(tp_varname, id, pageKey.current, startIndex, startIndex + pageSize, orderBy, order));
        } else {
            setValue(props.value[pageKey.current])
        }
    }, [startIndex, order, orderBy, tp_varname, id, dispatch, pageSize]);

    const handleRequestSort = useCallback((
        event: React.MouseEvent<unknown>,
        col: string,
      ) => {
        const isAsc = orderBy === col && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(col);
      }, [orderBy, order]);

    const createSortHandler = useCallback((col: string) => (event: React.MouseEvent<unknown>) => {
        handleRequestSort(event, col);
    }, [handleRequestSort]);

    const handleChangePage = useCallback((event: unknown, newPage: number) => {
        setStartIndex(newPage * rowsPerPage);
    }, [rowsPerPage]);

    const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setStartIndex(0);
    }, []);

    const [colsOrder, columns] = useMemo(() =>{
        const columns = JSON.parse(props.columns);
        return [Object.keys(columns).sort(getsortByIndex(columns)), columns];
    }, [props.columns]);

    const {rows, rowCount} = useMemo(() => {
        const ret = {rows: [], rowCount: 0} as {rows: any[], rowCount: number};
        if (value) {
            if (value.data) {
                ret.rows = Object.keys(value.data).map(key => value.data[key]);
            }
            if (value.rowcount) {
                ret.rowCount = value.rowcount as unknown as number;
            }
        }
        return ret;
    }, [value]);

    return <>
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <MuiTable
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={'medium'}
          >
        <TableHead>
            <TableRow>
                {
                    colsOrder.map((col, idx) => <TableCell 
                        key={col + idx} 
                        sortDirection={orderBy === columns[col].dfid && order}>
                            <TableSortLabel
                                active={orderBy === columns[col].dfid}
                                direction={orderBy === columns[col].dfid ? order : 'asc'}
                                onClick={createSortHandler(columns[col].dfid)}
                                >
                            {columns[col].title || columns[col].dfid}
                            {orderBy === columns[col].dfid ? (
                                <Box component="span" sx={visuallyHidden}>
                                {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                            </TableSortLabel>
                        </TableCell>)
                }
            </TableRow>
        </TableHead>
        <TableBody>
            {
            rows.map((row, index) => {
                  const isItemSelected = false;
                  return (
                    <TableRow
                      hover
                      tabIndex={-1}
                      key={'row' + index}
                      selected={isItemSelected}
                    >
                      {colsOrder.map((col, cidx) => <TableCell key={'val'+index + '-'+ cidx} {...alignCell(columns[col])}>{formatValue(row[col], columns[col])}</TableCell>)}
                    </TableRow>
                  );
                })
            }
        </TableBody>
        </MuiTable>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[pageSize]}
          component="div"
          count={rowCount}
          page={startIndex / pageSize}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      </Box>
    </>
};

export default Table;
