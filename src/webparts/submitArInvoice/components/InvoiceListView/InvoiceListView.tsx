import * as React from 'react';
import * as ReactDom from 'react-dom';

//PnPjs Imports.
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Kendo Imports.
import { filterBy } from '@progress/kendo-data-query';
import { ListView } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardImage, CardBody, CardSubtitle, CardActions } from '@progress/kendo-react-layout';
import { Input } from '@progress/kendo-react-inputs';
import { FloatingLabel } from '@progress/kendo-react-labels';
import { ChipList, Chip } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Button, SplitButton, DropDownButton } from '@progress/kendo-react-buttons';

// Fluent UI Imports. 
import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';

// My Imports
import { QueryInvoiceData2 } from '../InvoiceDataProvider';


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

/**
 * An Item in the InvoiceListView list. 
 */
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

	//#region CRUD Methods
	public enterEdit = () => {
		debugger;
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
	//#endregion

	//#region Component Functions
	private EditBody = (props?: any) => {
		const item = this.props.dataItem;
		return (
			<CardBody>
				<div className='k-hbox k-justify-content-between k-flex-wrap'>
					<div style={{ width: '40%', padding: '5 0', wordWrap: 'break-word' }}>
						{JSON.stringify(item)}
					</div>
					<div style={{ width: '60%', padding: '5 0' }}>
						<button className='k-button k-primary' style={{ marginRight: 5 }} onClick={this.handleSave}>Save</button>
						<button className='k-button' onClick={this.cancelEdit}>Cancel</button>
					</div>
				</div>
			</CardBody>
		);
	}

	private ViewBody = (props?: any) => {
		const item = this.props.dataItem;

		const iconItems = [
			{ text: "Edit", icon: "edit" },
			{ text: "Cancel", icon: "cancel" },
			{ text: "Request Approval", icon: "check" }
		];

		const onItemClick = (e) => {
			switch (e.item.text.toLowerCase()) {
				case "edit":
					this.enterEdit();
					break;
				case "cancel":
					alert('TODO: Open Cancel Dialog.');
					break;
				case "request approval":
					alert('TODO: Open Approval Dialog.');
					break;
				default:
					alert('No action set for this button');
					break;
			}
		};
		return (
			<CardBody>
				<div className='k-hbox k-justify-content-between k-flex-wrap'>
					<div style={{ width: '90%', padding: '5 0' }}>
						<CardTitle style={{ fontSize: 16 }}>
							{item.Urgent && <span className={'k-icon k-i-warning'}></span>} <span>{item.ID}</span> | {item.Invoice_x0020_Status} | {item.Title}
						</CardTitle>
						<CardSubtitle>
							sub title here
						</CardSubtitle>
					</div>
					<div style={{ width: '10%', padding: '5 0' }}>
						<SplitButton items={iconItems} text={'Edit'} icon={'edit'} look="flat" onButtonClick={this.enterEdit} onItemClick={(e) => onItemClick(e)} />
					</div>
				</div>
				<CardActions layout='stretched'>
					<Button className={'k-text-success'} icon='check' look='flat'>Approve</Button>
					<Button className={'k-text-error'} icon='times' look='flat'>Deny</Button>
				</CardActions>
			</CardBody>
		);
	}
	//#endregion

	public render() {
		return (
			<Card key={this.props.dataItem.ID} orientation='horizontal' style={{ marginBottom: '2.5px', marginTop: '2.5px' }}>
				{this.state.item.edit ? this.EditBody() : this.ViewBody()}
			</Card>
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

		// ! This is what populates the list view with data. 
		QueryInvoiceData2(null, invoices => {
			// Create a new variable by reference. Changes made to 'a' will be reflected in 'b'.
			// let a = b
			// Create a new variable by value instead of reference. Changes made in 'visibleData' will not be reflected in 'orders'.
			let visibleData = invoices.slice(0);

			this.setState({
				availableData: visibleData,
				allInvoices: invoices,
				data: visibleData.splice(0, 50)
			});
		});
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
				<div>
					<ListView
						onScroll={this.scrollHandler}
						data={this.state.data}
						item={this.MyItemRender}
						style={{ width: "100%", minHeight: 530 }}
						header={this.MyHeader}
					/>
				</div> :
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
