import reactLogo from './assets/react.svg';

function Card() {
    return (
        <div className="card">
            <img className="card-image" src={reactLogo} alt="Card Image" />
            <h2 className="card-title">Shourya</h2>
            <p className="card-description">Studying at Del Norte High School</p>
        </div>
    );
}

export default Card;