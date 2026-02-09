export const downloadCSV = (data, filename) => {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = ('' + (val || '')).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const prepareBookingsForExport = (bookings) => {
    return bookings.map(b => ({
        ID: b.id,
        Service: b.service_name,
        Client: b.client_name || 'Guest',
        Date: b.date_text,
        Time: b.time_text,
        Price: b.price,
        Status: b.status,
        Created: b.created_date
    }));
};

export const prepareRevenueForExport = (transactions) => {
    return transactions.map(t => ({
        ID: t.id,
        Date: t.created_date,
        Amount: t.amount_text,
        Description: t.description,
        Status: t.status
    }));
};