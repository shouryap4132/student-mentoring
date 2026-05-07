
function List() {
    const fruits = ["Apple", "Banana", "Cherry"];

    const listItems = fruits.map(fruit => <li key={fruit}>{fruit}</li>);
    return (
        <ul>
            {listItems}
        </ul>
    );
}

export default List;