import { Redirect, useLocalSearchParams } from 'expo-router';

/** The invite QR opens mummysaidso://join/CODE; hand the code to the family screen. */
export default function Join() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={{ pathname: '/family', params: { code } }} />;
}
