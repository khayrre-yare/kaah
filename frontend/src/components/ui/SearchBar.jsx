import { Search } from 'lucide-react';
import Input from './Input';

export default function SearchBar(props) {
  return <Input leftIcon={<Search size={18} />} {...props} />;
}
