import List from './components/List';

function App() {

  const fruits = [
        {id: 1, "name": "Apple", calories: 95}, 
        {id: 2, "name": "Banana", calories: 105},
        {id: 3, "name": "Cherry", calories: 50},
        {id: 4, "name": "Orange", calories: 62}
    ];
  const veggies = [
        {id: 6, "name": "Carrot", calories: 25}, 
        {id: 7, "name": "Broccoli", calories: 55},
        {id: 8, "name": "Spinach", calories: 20},
        {id: 9, "name": "Peas", calories: 62}
    ];
  
  return (
    <>
      <List items={fruits} category="Fruits" />
      <List items={veggies} category="Veggies" />

    </>   
  );
}

export default App
