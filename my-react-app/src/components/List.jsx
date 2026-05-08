
function List({category = "Items", items = []}) {
    const itemList = items;

    const listItems = itemList.map(item => <li key={item.id}>{item.name} - {item.calories} calories</li>);
    return (
        <>
            <h3 className="list-category">{category}</h3>
            <ol className="list-items">
                {listItems}
            </ol>
        </>
    );
}

export default List;