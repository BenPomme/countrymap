const fs = require('fs');
const countries = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'));

console.log('=== Countries with incomplete lifestyle data ===\n');

const fields = ['vacationDays', 'socialMediaUse', 'meatConsumption', 'vegetarianRate',
                'netflixSubscribers', 'spotifyUsers', 'fastFoodSpending',
                'gymMembership', 'yogaPractitioners'];

countries.forEach(country => {
  const missingFields = fields.filter(field =>
    !country.lifestyle || country.lifestyle[field] === null || country.lifestyle[field] === undefined
  );

  if (missingFields.length > 0) {
    console.log(`${country.name} (${country.iso3}): Missing ${missingFields.length} fields`);
    console.log(`  Missing: ${missingFields.join(', ')}`);
  }
});

// Summary statistics
const totalCountries = countries.length;
const totalPossibleDataPoints = totalCountries * fields.length;
const actualDataPoints = countries.reduce((sum, country) => {
  return sum + fields.filter(field =>
    country.lifestyle && country.lifestyle[field] !== null && country.lifestyle[field] !== undefined
  ).length;
}, 0);

console.log(`\n=== Final Statistics ===`);
console.log(`Total countries: ${totalCountries}`);
console.log(`Total possible data points: ${totalPossibleDataPoints}`);
console.log(`Actual data points added: ${actualDataPoints}`);
console.log(`Coverage: ${(actualDataPoints/totalPossibleDataPoints*100).toFixed(2)}%`);
console.log(`Missing data points: ${totalPossibleDataPoints - actualDataPoints}`);
