var Scanner = require('../lib/DxfArrayScanner.js');
require('should');

describe('Scanner', function() {
	describe('.hasNext()', function() {
		it('should return false when the array is empty', function() {
			var scanner = new Scanner([]);
			scanner.hasNext().should.be.false;
		});

		it('should return false when the array has length 1', function() {
			var scanner = new Scanner(['1']);
			scanner.hasNext().should.be.false;
		});

		it('should return true when the array has length 2', function() {
			var scanner = new Scanner(['1','2']);
			scanner.hasNext().should.be.true;
		});

		it('should return false when the array has length 4 and pointer is on the last element', function() {
			var scanner = new Scanner(['1','2','3','4']);
			scanner._pointer = scanner._data.length - 1;
			scanner.hasNext().should.be.false;
		});

		it('should return true when the array has length 4 and pointer is on the second-to-last element', function() {
			var scanner = new Scanner(['1','2','3','4']);
			scanner._pointer = scanner._data.length - 2;
			scanner.hasNext().should.be.true;
		});
	});

	describe('.next()', function() {
		it('should throw an error when the array is empty', function() {
			var scanner = new Scanner([]);
			scanner.next.bind(scanner).should.throw(/Unexpected end of input/);
		});
		it('should throw an error when the array has only 1 element', function() {
			var scanner = new Scanner(['1']);
			scanner.next.bind(scanner).should.throw(/Unexpected end of input/);
		});
		it('should throw an error when next is called and eof has already been read', function(){
			var scanner = new Scanner(['1','2']);
			scanner._eof = true;
			scanner.next.bind(scanner).should.throw(/Cannot call \'next\' after EOF/);
		});
		it('should return the 1st and 2nd index as the code and value respectively', function() {
			var scanner = new Scanner(['1','2']);
			var result = scanner.next();
			result.should.eql({ code: 1, value: '2'});
		});
		it('should set _eof to true when EOF code-value pair is read', function() {
			var scanner = new Scanner(['0','EOF']);
			scanner.next();
			scanner._eof.should.be.true;
		});
		it('should increment the pointer by 2', function() {
			var scanner = new Scanner(['1','2']);
			scanner.next();
			scanner._pointer.should.eql(2);
		});
	});
	describe('.isEOF()', function() {
		it('should be true when _eof is true', function() {
			var scanner = new Scanner(['0','EOF']);
			scanner._eof = true;
			scanner.isEOF().should.be.true;
		});
	});
});