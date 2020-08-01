import * as React from 'react';
import * as ReactDom from 'react-dom';

import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Pager } from '@progress/kendo-react-data-tools';
import { Button } from '@progress/kendo-react-buttons';

class ARListViewItem extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            ...props
        };
    }



    public render() {
        return (
            <Card type={this.state.index % 2 === 0 ? 'info' : ''}
                key={this.state.dataItem.ID}
                orientation={'vertical'}
                style={{
                    borderWidth: '0px 0px 1px',
                    width: '100%',
                    marginBottom: '2px',
                }}
            >
                <CardBody>
                    <div className='row p-2 border-bottom align-middle' style={{ margin: 0 }}>
                        <div className='col-sm-2'>
                            ID: {this.state.dataItem.ID}
                        </div>
                        <div className='col-sm-6'>
                            <h2 style={{ fontSize: 14, color: '#454545', marginBottom: 0, marginTop: 0 }} className="text-uppercase">name</h2>
                            <div style={{ fontSize: 12, color: "#a0a0a0" }}>email</div>
                        </div>
                        <div className='col-sm-4'>
                            <div className='k-chip k-chip-filled'>
                                <div className='k-chip-content'>new messages</div>
                            </div>
                        </div>
                    </div>
                    <hr />
                </CardBody>

                {this.state.showMore &&
                    <div>
                        <CardBody>
                            <p>Card body 2</p>
                            <hr />
                        </CardBody>
                        <CardBody>
                            <p>Card body 3</p>
                            <hr />
                        </CardBody>
                        <CardBody>
                            <p>Card body 4</p>
                            <hr />
                        </CardBody>
                        <CardBody>
                            <p>Card body 5</p>
                            <hr />
                        </CardBody>
                        <CardBody>
                            <p>Card body 6</p>
                            <hr />
                        </CardBody>
                    </div>
                }

                <CardActions>
                    <Button className='k-button k-primary' onClick={(e) => {
                        console.log(e);
                        this.setState({
                            showMore: !this.state.showMore
                        });
                    }} >Show More</Button>
                    <button className='k-button k-bare'>2</button>
                    <button className='k-button k-bare'>3</button>
                    <button className='k-button k-bare'>4</button>
                </CardActions>
            </Card>
        );
    }
}


export { ARListViewItem };
