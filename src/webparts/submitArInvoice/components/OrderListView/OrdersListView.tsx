import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardImage, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { Input } from '@progress/kendo-react-inputs';
import { FloatingLabel } from '@progress/kendo-react-labels';
import { filterBy } from '@progress/kendo-data-query';
import { ChipList, Chip } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';

import { Shimmer, ShimmerElementType, IShimmerElement } from 'office-ui-fabric-react/lib/Shimmer';


import { QueryInvoiceData, QueryOrdersDate } from '../InvoiceDataProvider';


const STATUS_OPTIONS = [
    {
        text: 'Pending',
        value: 'Pending',
        type: 'info'
    },
    {
        text: 'Approved',
        value: 'Approved',
        type: 'success'
    },
    {
        text: 'Deny',
        value: 'Deny',
        type: 'error'
    },
    {
        text: 'Void',
        value: 'Void',
        type: 'none'
    },
]

class OrdersListViewItemRender extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            item: this.props.dataItem
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.dataItem.ID !== this.props.dataItem.ID) {
            this.setState({
                item: this.props.dataItem
            });
        }
    }
    enterEdit = () => {
        this.setState({ item: { ...this.state.item, edit: true } });
    }
    cancelEdit = () => {
        this.setState({ item: { ...this.state.item, edit: false } });
    }
    handleChange = (e, field) => {
        let updatedItem = { ...this.state.item };
        updatedItem[field] = e.value;
        this.setState({ item: updatedItem });
    }
    handleSave = () => {
        this.props.saveItem(this.state.item);
        this.setState({ item: { ...this.state.item, edit: false } });
    }
    handleDelete = () => {
        this.props.deleteItem(this.state.item);
    }

    render() {
        const item = this.props.dataItem;
        const cardTypes = {
            Pending: 'info',
            Approved: 'success',
            Deny: 'error',
            void: null
        };
        return (
            <div key={this.props.dataItem.ID}>
                <Card orientation='horizontal' type={cardTypes[this.props.dataItem.Status]} style={{ borderWidth: '0px 0px 1px' }}>
                    {this.state.item.edit ?
                        <CardBody>
                            <div className='k-hbox k-justify-content-between k-flex-wrap'>
                                <div style={{ width: '40%', padding: '5 0' }}>
                                    <label style={{ display: 'block' }}>Title:</label>
                                    <Input value={this.state.item.Title} onChange={(e) => this.handleChange(e, 'Title')} />
                                    <label style={{ display: 'block' }}>Status:</label>
                                    <DropDownList
                                        data={STATUS_OPTIONS.map(f => f.value)}
                                        value={this.state.item.Status}
                                        onChange={(e) => this.handleChange(e, 'Status')}
                                    />
                                </div>
                                <div style={{ width: '25%', padding: '5 0' }}>
                                    <button className='k-button k-primary' style={{ marginRight: 5 }} onClick={this.handleSave}>Save</button>
                                    <button className='k-button' onClick={this.cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        </CardBody>
                        : <CardBody>
                            <div className='k-hbox k-justify-content-between k-flex-wrap'>
                                <div style={{ width: '40%', padding: '5 0' }}>
                                    <CardTitle style={{ fontSize: 16 }}>
                                        {item.Title}
                                    </CardTitle>
                                    <CardSubtitle>
                                        {item.Status}
                                    </CardSubtitle>
                                </div>
                                <div style={{ width: '25%', padding: '5 0' }}>
                                    <button className='k-button k-primary' style={{ marginRight: 5 }} onClick={this.enterEdit}>Edit</button>
                                    <button className='k-button' onClick={this.handleDelete}>Delete</button>
                                </div>
                            </div>
                        </CardBody>}
                </Card>
            </div>
        )
    }
}


interface IOrdersListViewState {
    // Data that we have but do not want visible yet.
    availableData?: any[];

    // Data tht we want visible.
    data?: any[];

    // All Orders
    orders?: any[];

    ordersCount: number;

    searchValue?: any;
    selectedChips?: any[];

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
        let filterRes = filterBy(this.state.orders, event.filter).slice(0);
        this.setState({
            filter: event.filter,
            availableData: filterRes,
            data: filterRes.splice(0, 12)
        });
    }

    private MyHeader = () => {
        return (
            <div>
                <FloatingLabel
                    label={`List View Header ${this.state.data.length}/${this.state.ordersCount} | ${this.state.orders.length}`}
                    editorId={'search'}
                    editorValue={this.state.searchValue}
                    style={{ width: '100%' }}
                >
                    <Input
                        id={'search'}
                        disabled={true}
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
                <ChipList
                    style={{ marginTop: '5px', marginBottom: '5px' }}
                    defaultData={STATUS_OPTIONS}
                    selection={'multiple'}
                    onChange={(e) => {
                        // e.value is an array of values from defaultData.
                        this.setState({ selectedChips: e.value });
                        this.onFilterChange({
                            filter: {
                                logic: 'or',
                                filters: e.value.map(f => {
                                    return { field: 'Status', operator: 'contains', value: f }
                                })
                            }
                        });
                    }}
                    chip={(props) =>
                        <Chip {...props} type={props.dataItem.type} />
                    }
                />
            </div>
        );
    };

    private MyItemRender = props => <OrdersListViewItemRender {...props} saveItem={e => console.log(e)} deleteItem={e => console.log(e)} />

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
