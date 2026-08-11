export function convertNumberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === null) return '';
  if (amount === 0) return 'Indian Rupee Zero Only';

  const singleDigit = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const doubleDigit = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function numToWords(n: number): string {
    let str = '';

    if (n > 19) {
      str += doubleDigit[Math.floor(n / 10)];
      if (n % 10 > 0) {
        str += '-' + singleDigit[n % 10];
      }
    } else {
      str += singleDigit[n];
    }
    return str;
  }

  const roundedInt = Math.floor(amount);
  const paise = Math.round((amount - roundedInt) * 100);

  let rupeesStr = '';

  const crore = Math.floor(roundedInt / 10000000);
  let remainder = roundedInt % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = Math.floor(remainder / 100);
  remainder = remainder % 100;

  if (crore > 0) {
    rupeesStr += numToWords(crore) + ' Crore ';
  }

  if (lakh > 0) {
    rupeesStr += numToWords(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    rupeesStr += numToWords(thousand) + ' Thousand ';
  }

  if (hundred > 0) {
    rupeesStr += numToWords(hundred) + ' Hundred ';
  }

  if (remainder > 0) {
    if (rupeesStr !== '') {
      rupeesStr += 'and ';
    }
    rupeesStr += numToWords(remainder) + ' ';
  }

  rupeesStr = rupeesStr.trim();

  let result = 'Indian Rupee ';
  if (rupeesStr.length > 0) {
    result += rupeesStr;
  } else {
    result += 'Zero';
  }

  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }

  result += ' Only';
  return result;
}
