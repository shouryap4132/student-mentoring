import Student from './components/Student.jsx';

function App() {
  return (
    <>
      <Student name="SpongeBob" age="nah" isStudent={true}/>
      <Student name="Patrick" age={43} isStudent={false}/>
      <Student name="Squidward" age={50} isStudent={false}/>
      <Student name="Sandy" age={32} isStudent={true}/>

      <Student /> 

    </>
  );
}

export default App
