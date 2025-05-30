import React, { useState } from 'react';
import './CountryCodeSelector.css';

const countries = [
  { code: '+93', country: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+376', country: 'AD', flag: '🇦🇩', name: 'Andorra' },
  { code: '+244', country: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+374', country: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+994', country: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+375', country: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+501', country: 'BZ', flag: '🇧🇿', name: 'Belize' },
  { code: '+229', country: 'BJ', flag: '🇧🇯', name: 'Benin' },
  { code: '+975', country: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+387', country: 'BA', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { code: '+267', country: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+673', country: 'BN', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359', country: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+226', country: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257', country: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '+855', country: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237', country: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+238', country: 'CV', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+236', country: 'CF', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+235', country: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+269', country: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: '+242', country: 'CG', flag: '🇨🇬', name: 'Congo' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+385', country: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+357', country: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+253', country: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+240', country: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+291', country: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+372', country: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '+251', country: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+679', country: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+241', country: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { code: '+220', country: 'GM', flag: '🇬🇲', name: 'Gambia' },
  { code: '+995', country: 'GE', flag: '🇬🇪', name: 'Georgia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+233', country: 'GH', flag: '🇬🇭', name: 'Ghana' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+224', country: 'GN', flag: '🇬🇳', name: 'Guinea' },
  { code: '+245', country: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+592', country: 'GY', flag: '🇬🇾', name: 'Guyana' },
  { code: '+509', country: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+354', country: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+98', country: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: '+964', country: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+225', country: 'CI', flag: '🇨🇮', name: 'Ivory Coast' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7', country: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+996', country: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+856', country: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '+371', country: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+266', country: 'LS', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+231', country: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: '+218', country: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '+423', country: 'LI', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+370', country: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352', country: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+261', country: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+265', country: 'MW', flag: '🇲🇼', name: 'Malawi' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+960', country: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: '+223', country: 'ML', flag: '🇲🇱', name: 'Mali' },
  { code: '+356', country: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '+222', country: 'MR', flag: '🇲🇷', name: 'Mauritania' },
  { code: '+230', country: 'MU', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+373', country: 'MD', flag: '🇲🇩', name: 'Moldova' },
  { code: '+377', country: 'MC', flag: '🇲🇨', name: 'Monaco' },
  { code: '+976', country: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+382', country: 'ME', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+258', country: 'MZ', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+95', country: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+264', country: 'NA', flag: '🇳🇦', name: 'Namibia' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+227', country: 'NE', flag: '🇳🇪', name: 'Niger' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+850', country: 'KP', flag: '🇰🇵', name: 'North Korea' },
  { code: '+389', country: 'MK', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '+675', country: 'PG', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+250', country: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+221', country: 'SN', flag: '🇸🇳', name: 'Senegal' },
  { code: '+381', country: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '+248', country: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { code: '+232', country: 'SL', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+421', country: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+386', country: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+211', country: 'SS', flag: '🇸🇸', name: 'South Sudan' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+249', country: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: '+597', country: 'SR', flag: '🇸🇷', name: 'Suriname' },
  { code: '+268', country: 'SZ', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+963', country: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+992', country: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+255', country: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+228', country: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: '+676', country: 'TO', flag: '🇹🇴', name: 'Tonga' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+993', country: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+256', country: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+998', country: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+678', country: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+967', country: 'YE', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260', country: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', country: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' }
];

const CountryCodeSelector = ({ value = '+1', onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCountry = countries.find(country => country.code === value) || countries[0];

  const handleSelect = (countryCode) => {
    onChange(countryCode);
    setIsOpen(false);
  };

  return (
    <div className="country-code-selector">
      <button 
        type="button"
        className="country-code-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flag">{selectedCountry.flag}</span>
        <span className="code">{selectedCountry.code}</span>
        <span className="arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="country-dropdown">
          <div className="dropdown-content">
            {countries.map((country, index) => (
              <button
                key={`${country.country}-${index}`}
                type="button"
                className="dropdown-item"
                onClick={() => handleSelect(country.code)}
              >
                <span className="flag">{country.flag}</span>
                <span className="code">{country.code}</span>
                <span className="name">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector; 