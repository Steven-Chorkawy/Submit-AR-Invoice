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


export class InvoiceListView extends React.Component<any, any> {

    constructor(props) {
        super(props);
    }

    public render() {
        return (<p>hello</p>);
    }
}