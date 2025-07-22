const contractArtifact = require('../abi/contract.json');

module.exports = {
  ROLES: {
    CLIENT: 'client',
    FREELANCER: 'freelancer',
    ADMIN: 'admin',
  },
  JOB_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DISPUTED: 'disputed',
    CANCELLED: 'cancelled',
  },
  CONTRACT_ABI: contractArtifact.abi,
}; 