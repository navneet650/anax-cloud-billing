import CustomerTable from "../../components/CustomerTable";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import type { Customer } from "../../types/customer";
import { customerService } from "../../services/customerService";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
const [contactPerson, setContactPerson] = useState("");
const [email, setEmail] = useState("");
const [mobile, setMobile] = useState("");
  const [rows, setRows] = useState<Customer[]>(() => {
  const savedCustomers = customerService.getAll();

  if (savedCustomers.length > 0) {
    return savedCustomers;
  }

  const now = new Date().toISOString();

  const sampleCustomers: Customer[] = [
    {
      id: "cust-001",
      companyName: "ABC Technologies Pvt Ltd",
      contactPerson: "Rahul Sharma",
      gstin: "08ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      email: "rahul@abctech.com",
      mobile: "9876543210",
      addressLine1: "123 Business Park",
      addressLine2: "",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      country: "India",
      customerType: "Business",
      paymentTerms: 30,
      creditLimit: 100000,
      gstRegistered: true,
      isActive: true,
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cust-002",
      companyName: "XYZ Industries",
      contactPerson: "Amit Patel",
      gstin: "24ABCDE9876F1Z2",
      pan: "ABCDE9876F",
      email: "amit@xyz.com",
      mobile: "9876501234",
      addressLine1: "45 Industrial Estate",
      addressLine2: "",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      country: "India",
      customerType: "Business",
      paymentTerms: 30,
      creditLimit: 150000,
      gstRegistered: true,
      isActive: true,
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  customerService.saveAll(sampleCustomers);

  return sampleCustomers;
});
function handleSave() {
  if (!companyName.trim()) {
    alert("Please enter Company Name");
    return;
  }

  if (!contactPerson.trim()) {
    alert("Please enter Contact Person");
    return;
  }

  const now = new Date().toISOString();

  const newCustomer: Customer = {
    id: crypto.randomUUID(),
    companyName,
    contactPerson,
    gstin: "",
    pan: "",
    email,
    mobile,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    customerType: "Business",
    paymentTerms: 30,
    creditLimit: 0,
    gstRegistered: false,
    isActive: true,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const updatedRows = [...rows, newCustomer];

  setRows(updatedRows);
  customerService.saveAll(updatedRows);

  setCompanyName("");
  setContactPerson("");
  setEmail("");
  setMobile("");

  setOpen(false);
}
const filteredRows = rows.filter((customer) =>
  customer.companyName.toLowerCase().includes(search.toLowerCase())
);
const columns: GridColDef[] = [
  {
    field: "companyName",
    headerName: "Company",
    flex: 2,
  },
  {
    field: "contactPerson",
    headerName: "Contact",
    flex: 1.5,
  },
  {
  field: "email",
  headerName: "Email",
  flex: 2,
},
  {
    field: "gstin",
    headerName: "GSTIN",
    flex: 1.8,
  },
  {
    field: "mobile",
    headerName: "Mobile",
    flex: 1.2,
  },
  {
    field: "state",
    headerName: "State",
    flex: 1,
  },
  {
    field: "status",
    headerName: "Status",
    flex: 1,
  },
];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">
          Customers
        </Typography>

       <Button
    variant="contained"
    color="secondary"
    startIcon={<AddIcon />}
    onClick={() => setOpen(true)}
>
          Add Customer
        </Button>
      </Box>

      {/* Search */}
<Paper sx={{ p: 2, mb: 3 }}>
  <TextField
    fullWidth
    label="Search Customers"
    placeholder="Search by Company, GSTIN, Mobile..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</Paper>

{/* Customer Grid */}
<CustomerTable
    title="Customer List"
    rows={filteredRows}
/>
<Paper sx={{ height: 500 }}>
  <DataGrid
    rows={filteredRows}
    columns={columns}
    pageSizeOptions={[5, 10, 20]}
    initialState={{
      pagination: {
        paginationModel: {
          pageSize: 5,
        },
      },
    }}
    disableRowSelectionOnClick
  />
</Paper>
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Add Customer</DialogTitle>

  <DialogContent>
    <TextField
    fullWidth
    label="Company Name"
    margin="normal"
    value={companyName}
    onChange={(e) => setCompanyName(e.target.value)}
/>

    <TextField
    fullWidth
    label="Contact Person"
    margin="normal"
    value={contactPerson}
    onChange={(e) => setContactPerson(e.target.value)}
/>
 <TextField
    fullWidth
    label="Email"
    margin="normal"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

  <TextField
    fullWidth
    label="Mobile"
    margin="normal"
    value={mobile}
    onChange={(e) => setMobile(e.target.value)}
  />
  
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpen(false)}>
      Cancel
    </Button>

   <Button
  variant="contained"
  color="secondary"
  onClick={handleSave}
>
  Save
</Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}