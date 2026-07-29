export default function PageHeader({ title }) {
    return (
        <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1B1F5C",
            margin: "0 0 20px"
        }}>
            {title}
        </h1>
    );
}
