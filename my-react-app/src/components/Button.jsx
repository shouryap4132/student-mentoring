
function Button() {
    const styles = {
            backgroundColor:"#007bff",
            border: "none",
            color: "white",
            borderRadius: "4px",
            padding: "10px 20px",
            fontSize: "16px",
            margin: "4px 2px",
            cursor: "pointer"
    }
    return <button style={styles} >Click me</button>;
}

export default Button;