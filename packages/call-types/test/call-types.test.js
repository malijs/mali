const { CallType } = require('../');

describe('call-types package', function () {
  test('should have exported enums', () => {
    expect(CallType.UNARY).toBeTruthy();
    expect(CallType.REQUEST_STREAM).toBeTruthy();
    expect(CallType.RESPONSE_STREAM).toBeTruthy();
    expect(CallType.DUPLEX).toBeTruthy();
  });
});
