import DxfParser from './DxfParser';

export default DxfParser;

export function parse(source:string) {
	return new DxfParser().parse(source);
}
