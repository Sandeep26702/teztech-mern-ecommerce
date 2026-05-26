import emailValidator from 'deep-email-validator';

async function test() {
  const res = await emailValidator({
    email: "test@mailinator.com",
    validateRegex: true,
    validateMx: true,
    validateTypo: true,
    validateDisposable: true,
    validateSMTP: false
  });
  console.log(res);
}
test();
