import * as React from 'react';
import * as ReactDom from 'react-dom';

//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Kendo Imports
import { filterBy } from '@progress/kendo-data-query';



interface IInvoiceListViewState {
    // Data that we want visible.
    data?: any[];

    // Data that we have but do not want visible yet.
    availableData?: any[];

    // All Invoices
    allInvoices?: any[];



    filter?: any;
    /**
     * *    Filter Example.
     * *    
     * *
     */
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

}

class InvoiceListViewItemRender extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            item: this.props.dataItem
        };
    }

    public componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.dataItem.ID !== this.props.dataItem.ID) {
            this.setState({
                item: this.props.dataItem
            });
        }
    }
    public enterEdit = () => {
        this.setState({ item: { ...this.state.item, edit: true } });
    }
    public cancelEdit = () => {
        this.setState({ item: { ...this.state.item, edit: false } });
    }
    public handleChange = (e, field) => {
        let updatedItem = { ...this.state.item };
        updatedItem[field] = e.value;
        this.setState({ item: updatedItem });
    }
    public handleSave = () => {
        this.props.saveItem(this.state.item);
        this.setState({ item: { ...this.state.item, edit: false } });
    }
    public handleDelete = () => {
        this.props.deleteItem(this.state.item);
    }

    public render() {
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
                                        {item.ID} | {item.Title}
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
        );
    }
}


export class InvoiceListView extends React.Component<any, IInvoiceListViewState> {
    constructor(props) {
        super(props);

        this.state = {
            availableData: undefined,
            data: undefined,
            allInvoices: undefined,
        };


        // TODO: Get data here.
        // QueryOrdersDate({}, (orders) => {
        //     // Create a new variable by reference. Changes made to 'a' will be reflected in 'b'.
        //     // let a = b
        //     // Create a new variable by value instead of reference. Changes made in 'visibleData' will not be reflected in 'orders'.
        //     let visibleData = orders.slice(0);

        //     this.setState({
        //         availableData: visibleData,
        //         orders: orders,
        //         ordersCount: orders.length,
        //         data: visibleData.splice(0, 50)
        //     });
        // });
    }

    //#region ListView Events
    private scrollHandler = (event) => {
        const e = event.nativeEvent;
        if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight) {
            // The number of records we want to add.
            const nMoreRecords = 50;
            const moreData = this.state.availableData.splice(0, nMoreRecords);
            if (moreData.length > 0) {
                this.setState({ data: this.state.data.concat(moreData) });
            }
        }
    }

    private onFilterChange = (event) => {
        let filterRes = filterBy(this.state.allInvoices, event.filter).slice(0);
        this.setState({
            filter: event.filter,
            availableData: filterRes,
            data: filterRes.splice(0, 50)
        });
    }
    //#endregion 

    //#region CRUD methods.
    private onSave = (e) => {
        // TODO: Save to SharePoint.
        console.log(e);
        // sp.web.lists.getByTitle(MyLists.Orders).items.getById(e.ID).update({ Title: e.Title, Status: e.Status }).then(value => {
        //     value.item.get().then(item => {
        //         let d = this.state.data;
        //         let indexOf = this.state.data.findIndex(f => f.ID === item.ID);
        //         d[indexOf] = { ...item };
        //         this.setState({
        //             data: d
        //         });
        //     });
        // });
    }
    //#endregion


    //#region Component Functions.
    private MyHeader = () => {
        return (<h4>My Header Here.</h4>);
    }

    private MyItemRender = props => <InvoiceListViewItemRender {...props} saveItem={this.onSave} deleteItem={e => console.log(e)} />;

    //#endregion



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
