import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardImage, CardSubtitle } from '@progress/kendo-react-layout';

import { QueryInvoiceData, QueryOrdersDate } from '../InvoiceDataProvider';



interface IOrdersListViewState {
    // Data that we have but do not want visible yet.
    availableData?: any[];

    // Data tht we want visible.
    data?: any[];

    // All Orders
    orders?: any[];
}

export class OrdersListView extends React.Component<any, IOrdersListViewState> {
    constructor(props) {
        super(props);
        
        this.state = {
            availableData: undefined,
            data: undefined,
            orders: undefined
        };

        QueryOrdersDate({}, (orders) => {
            this.setState({
                availableData: orders,
                orders: orders,
                data: orders.splice(0, 12)
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

    private MyHeader = () => {
        return (
            <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-4 pb-2 pt-2'>
                List View Header {this.state.data.length}/{this.state.orders.length}
            </ListViewHeader>
        );
    };

    private MyItemRender = props => {
        return (
            <Card style={{ width: 180, boxShadow: 'none', flex: '0 0 25.33%', margin: 25, border: 'none' }} >
                <div style={{ padding: 0 }}>
                    <CardTitle style={{ fontSize: 14 }}>
                        {props.dataItem.Title}
                    </CardTitle>
                    <CardSubtitle style={{ fontSize: 12, marginTop: 0 }}>
                        {props.dataItem.Status}
                    </CardSubtitle>
                </div>
            </Card>
        );
    };

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
                <h1>Loading...</h1>
        );
    }
}
