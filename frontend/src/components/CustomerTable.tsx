type CustomerTableProps = {
  title: string;
  rows: any[];
};

export default function CustomerTable(props: CustomerTableProps) {
  return (
    <h2>{props.title}</h2>
  );
}