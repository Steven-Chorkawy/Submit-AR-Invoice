import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardImage, CardSubtitle } from '@progress/kendo-react-layout';
import { Input } from '@progress/kendo-react-inputs';
import { FloatingLabel } from '@progress/kendo-react-labels';
import { filterBy } from '@progress/kendo-data-query';

import { Shimmer, ShimmerElementType, IShimmerElement } from 'office-ui-fabric-react/lib/Shimmer';


import { QueryInvoiceData, QueryOrdersDate } from '../InvoiceDataProvider';


interface IOrdersListViewState {
    // Data that we have but do not want visible yet.
    availableData?: any[];

    // Data tht we want visible.
    data?: any[];

    // All Orders
    orders?: any[];

    ordersCount: number;

    searchValue?: any;


    // filter: {
    //     logic: 'and', 
    //     filters: [
    //         { field: 'UnitPrice', operator: 'gt', value: 20 },
    //         { field: 'UnitPrice', operator: 'lt', value: 50 },
    //         { field: 'Discontinued', operator: 'eq', value: false },
    //         {
    //             logic: 'or', filters: [
    //                 { field: 'ProductName', operator: 'contains', value: 'organic' },
    //                 { field: 'ProductName', operator: 'contains', value: 'cranberry' },
    //             ]
    //         }
    //     ]
    // }
    filter?: any;
}

export class OrdersListView extends React.Component<any, IOrdersListViewState> {
    constructor(props) {
        super(props);

        this.state = {
            availableData: undefined,
            data: undefined,
            orders: undefined,
            ordersCount: 0,
        };

        QueryOrdersDate({}, (orders) => {
            // Create a new variable by reference. Changes made to 'a' will be reflected in 'b'.
            // let a = b
            // Create a new variable by value instead of reference. Changes made in 'visibleData' will not be reflected in 'orders'.
            let visibleData = orders.slice(0);

            this.setState({
                availableData: visibleData,
                orders: orders,
                ordersCount: orders.length,
                data: visibleData.splice(0, 12)
            });
        });
    }

    private scrollHandler = (event) => {
        const e = event.nativeEvent;
        if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight) {
            const moreData = this.state.availableData.splice(0, 6);
            if (moreData.length > 0) {
                this.setState({ data: this.state.data.concat(moreData) });
            }
        }
    }

    private onFilterChange = (event) => {
        console.log(this.state.orders);
        console.log(this.state.ordersCount);
        let filterRes = filterBy(this.state.orders, event.filter);
        this.setState({
            filter: event.filter,
            availableData: filterRes,
            data: filterRes.splice(0, 12)
        });
    }


    private MyHeader = () => {
        return (
            <FloatingLabel
                label={`List View Header ${this.state.data.length}/${this.state.ordersCount} | ${this.state.orders.length}`}
                editorId={'search'}
                editorValue={this.state.searchValue}
                style={{ width: '100%' }}
            >
                <Input
                    id={'search'}
                    style={{ width: '100%' }}
                    value={this.state.searchValue}
                    onChange={(e) => {
                        // ? Why does VS Code say that e can't have value??????
                        // TODO: Try using this line of code at work. 
                        //let value = e.value;
                        let value = e['value'];
                        this.setState({ searchValue: value });
                        this.onFilterChange({
                            filter: {
                                logic: 'or',
                                filters: [
                                    { field: 'Title', operator: 'contains', value: value },
                                    { field: 'Status', operator: 'contains', value: value },
                                ]
                            }
                        });
                    }}
                />
            </FloatingLabel>
        );
    };



    private MyItemRender = props => {
        let cardTypes = {
            Pending: 'info',
            Approved: 'success',
            Deny: 'error',
            void: 'warning'
        };

        return (
            <Card type={cardTypes[props.dataItem.Status]} style={{ margin: '5px' }} >
                <div style={{ padding: 0 }}>
                    <CardTitle style={{ fontSize: 14 }}>
                        {props.dataItem.Title}
                    </CardTitle>
                    <CardSubtitle style={{ fontSize: 12, marginTop: 0 }}>
                        {props.dataItem.Status}
                    </CardSubtitle>
                </div>
            </Card>
        )
    }



    public render() {
        return (
            this.state.data ?
                <ListView
                    onScroll={this.scrollHandler}
                    data={this.state.data}
                    item={this.MyItemRender}
                    style={{ width: "100%", height: 530 }}
                    header={this.MyHeader}
                /> :
                <div>
                    <div style={{ padding: 2 }}>
                        <Shimmer />
                    </div>
                    <div style={{ padding: 2 }}>
                        <Shimmer width="75%" />
                    </div>
                    <div style={{ padding: 2 }}>
                        <Shimmer width="50%" />
                    </div>
                </div>
        );
    }
}
