import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import supabase from '../../../config/supabaseClient';

import ChartColumn from './ChartColumn';

export default function Sales() {
  const [salesByBrand, setSalesByBrand] = useState([]);
  const [sales, setSales] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [salesByMonth, setSalesByMonth] = useState([]);
  
  const brandMapping = {
    1: 'Honda',
    2: 'Toyota',
    3: 'Audi',
    4: 'BMW',
    5: 'Ford',
    // Add more mappings as needed
  };

  // Initialize an object to store the count of sales for each brand
  const brandSalesCount = {};

  // Iterate over the salesData array
  if (sales) {
    sales.forEach(sale => {
      // Extract the brand_id from the sale object
      const brandId = sale.brand_id;

      // Retrieve the corresponding brand name from the brandMapping object
      const brandName = brandMapping[brandId];

      // Increment the count of sales for the corresponding brand
      brandSalesCount[brandName] = (brandSalesCount[brandName] || 0) + 1;
    });
  }

  // Convert the brandSalesCount object into an array of arrays suitable for the chart data
  const chartData = Object.entries(brandSalesCount)
    .sort(([, countA], [, countB]) => countB - countA) // Sort by total sales count in descending order
    .map(([brandName, totalSales]) => [brandName, totalSales]);

  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:8000/api/salesAll').then(response => response.json()),
      fetch('http://127.0.0.1:8000/api/customersAll').then(response => response.json()),
      fetch('http://127.0.0.1:8000/api/dealersAll').then(response => response.json()),
      fetch('http://127.0.0.1:8000/api/vehiclesAll').then(response => response.json())
    ])
      .then(([salesData, customersData, dealersData, vehiclesData]) => {
        const processedSales = salesData.map(item => {
          const customer = customersData.find(customer => customer.id === item.customer_id);
          const dealer = dealersData.find(dealer => dealer.id === item.dealer_id);
          const vehicle = vehiclesData.find(vehicle => vehicle.id === item.vehicle_id);
          const saleDate = new Date(item.sale_date);
          const formattedDate = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}-${saleDate.getDate().toString().padStart(2, '0')}`;
          return {
            ...item,
            name: customer ? customer.name : 'unknown Customer',
            dealer_name: dealer ? dealer.dealer_name : 'Unknown Dealer',
            vin: vehicle ? vehicle.vin : 'Unknown VIN',
            brand_id: vehicle ? vehicle.brand_id : 'unknown brand',
            model_id: vehicle ? vehicle.model_id : 'unknown model',
            date: formattedDate,
          };
        });
        setSales(processedSales);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);
  

  console.log(sales)

  useEffect(() => {
    if (sales && sales.length > 0) {
      // Count the number of sales for each brand on each date
      const salesByBrandAndDate = sales.reduce((acc, curr) => {
        const { date, brand_id } = curr;
        if (!acc[date]) {
          acc[date] = {};
        }
        if (!acc[date][brand_id]) {
          acc[date][brand_id] = 0;
        }
        acc[date][brand_id]++;
        return acc;
      }, {});

      // Format data for chart
      const chartData = Object.entries(salesByBrandAndDate).map(([date, brandCounts]) => {
        const data = [date];
        Object.values(brandCounts).forEach(count => {
          data.push(count);
        });
        return data;
      });

      setSalesByBrand(chartData);
    }
  }, [sales]);
  

  console.log(sales)

  console.log(chartData)

  
  const lineChartData = sales
    ? sales.map((sale, index) => [sale.sale_date, index + 1])
    : [];

  const options = {
    chart: {
      title: 'Total Sales Over Time',
      subtitle: 'in millions of dollars (USD)'
    },
    width: 600, // Adjusted width
    height: 300,
    hAxis: {
      title: 'Sale Date',
    },
    vAxis: {
      title: 'Total Sales',
    },
  };

  const chartData1 = [['Month', ...Object.keys(brandMapping)]];

  // Iterate over salesByMonth to populate chartData1
  Object.keys(salesByMonth).forEach(month => {
    const rowData = [month];
    Object.keys(brandMapping).forEach(brandId => {
      rowData.push(salesByMonth[month][brandId] || 0);
    });
    chartData1.push(rowData);
  });

  return (
    <div className='container'>
      <div className='ml-5 mt-5 pb-7'>
        <Chart
          width={'600px'}
          height={'300px'}
          chartType="PieChart"
          loader={<div>Loading Chart</div>}
          data={[['Brand', 'Total Sales'], ...chartData]}
          options={{
            title: 'Brand Sales',
            pieHole: 0.4,
          }}
          rootProps={{ 'data-testid': '1' }}
        />
        <div className='ml-[-20px] mt-[-40px]'>
          <ChartColumn />
        </div>
       
      </div>
      <div className='mt-10'>
        <h1 className='text-white ml-12 text-xl font-semibold'>Records</h1>
        <h1 className='text-white ml-12 '>Total sale: {salesCount}</h1>
        {sales && 
          <div className="container px-10">
            <table className=" border w-[600px] rounded-sm">
              <thead>
                <tr>
                  <th className='bg-slate-100 w-[70px]'>ID</th>
                  <th className='bg-slate-600 w-[200px]'>VIN</th>
                  <th className='bg-slate-100 w-[170px]'>Customer Buyer</th>
                  <th className='bg-slate-600 w-[80px]'>Brand</th>
                  <th className='bg-slate-100 w-[170px]'>Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr className='text-white border py-3 text-center' key={index}>
                    <td className='text-center'>{sale.id}</td>
                    <td>{sale.vin}</td>
                    <td>{sale.name}</td>
                    <td>{sale.brand_id}</td>
                    <td>{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

     
    </div>
  );
}
