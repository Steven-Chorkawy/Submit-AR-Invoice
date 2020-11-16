import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardImage, CardSubtitle } from '@progress/kendo-react-layout';

import destinations from './destinations.json';

const createLargeData = () => {
    let data = destinations.slice();
    for (let i = 0; i < 4; i++) {
        data = data.concat(destinations);
    }
    return data;
}
const availableData = createLargeData();

const MyHeader = () => {
    return (
        <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-4 pb-2 pt-2'>
            Top European destinations
        </ListViewHeader>
    );
}

const MyItemRender = props => {
    return (
        <Card style={{ width: 180, boxShadow: 'none', flex: '0 0 25.33%', margin: 25, border: 'none' }} >
            <CardImage src={`https://gist.github.com/simonssspirit/0db46d4292ea8e335eb18544718e2624/raw/54748432143492082bf60eee16c1c681f4d6270f/${props.dataItem.Image}`} style={{ height: 150, width: 180 }} />
            <div style={{ padding: 0 }}>
                <CardTitle style={{ fontSize: 14 }}>
                    {props.dataItem.Destination}
                </CardTitle>
                <CardSubtitle style={{ fontSize: 12, marginTop: 0 }}>
                    {props.dataItem.Text}
                </CardSubtitle>
            </div>
        </Card>
    );
}
class KendoDemo extends React.Component {
    state = {
        data: availableData.splice(0, 12)
    };

    scrollHandler = (event) => {
        const e = event.nativeEvent;
        if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight) {
            const moreData = availableData.splice(0, 6);
            if (moreData.length > 0) {
                this.setState({ data: this.state.data.concat(moreData) });
            }
        }
    }

    render() {
        return (
            <ListView
                onScroll={this.scrollHandler}
                data={this.state.data}
                item={MyItemRender}
                style={{ width: "100%", height: 530 }}
                header={MyHeader}
            />
        );
    }
}

ReactDOM.render(
    <React.Fragment>
        <App />
        <style>
            {`.k-listview-content {
            display: flex;
            flex-wrap: wrap;
        }`}
        </style>
    </React.Fragment>, document.querySelector('my-app')
);