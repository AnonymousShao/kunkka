function checkVolumeTotalLegality(data, totalType) {
  let legal;
  let total = 0;
  let volumeTypesArr = [];

  for(let i in data) {
    if(i.indexOf(totalType + '_') !== -1) {
      volumeTypesArr.push(data[i].total);
    }
  }

  for(let i = 0; i < volumeTypesArr.length; i++) {
    if(volumeTypesArr[i] === -1) {
      total = -1;
      break;
    } else {
      total += volumeTypesArr[i];
    }
  }

  if(data[totalType].total === -1) {
    legal = true;
  } else {
    if(total === -1) {
      legal = false;
    } else {
      legal = (data[totalType].total >= total) ? true : false;
    }
  }
  return legal;
}

function isVolumeFieldChanged(quota, volumeTypes) {
  let numberChanged = false,
    gigabyteChanged = false,
    snapshotChanged = false;

  if(quota.volumes.isChanged) {
    numberChanged = true;
  }
  if(quota.gigabytes.isChanged) {
    gigabyteChanged = true;
  }
  if(quota.snapshots.isChanged) {
    snapshotChanged = true;
  }

  for(let i = 0; i < volumeTypes.length; i++) {
    const type = volumeTypes[i];
    if(quota['volumes_' + type].isChanged) {
      numberChanged = true;
    }
    if(quota['gigabytes_' + type].isChanged) {
      gigabyteChanged = true;
    }
    if(quota['snapshots_' + type].isChanged) {
      snapshotChanged = true;
    }
  }

  return {
    numberChanged,
    gigabyteChanged,
    snapshotChanged
  };
}

function quotaValidate(quota, volumeTypes, __) {
  const result = {
    status: 'pass',
    errorMessage: ''
  };

  for(let item in quota) {
    let resource = quota[item];
    if(resource.total !== -1 && resource.total < resource.used) {
      result.status = 'fail';
      let msgPrefix = '';

      switch(item) {
        case 'instances':
          msgPrefix = __.instance;
          break;
        case 'key_pairs':
          msgPrefix = __.keypair;
          break;
        case 'cores':
          msgPrefix = __.cpu;
          break;
        case 'volumes':
          msgPrefix = __.all_volumes;
          break;
        case 'gigabytes':
          msgPrefix = __.all_gigabytes;
          break;
        case 'snapshots':
          msgPrefix = __.all_snapshots;
          break;
        default:
          if(item.indexOf('volumes_') !== -1) {
            const type = item.slice(8);
            msgPrefix = (__[type] !== undefined ? __[type] : type) + __.volume;
          } else if(item.indexOf('gigabytes_') !== -1) {
            const type = item.slice(10);
            msgPrefix = (__[type] !== undefined ? __[type] : type) + __.volume + __.gigabyte + __.unit_gb;
          } else if(item.indexOf('snapshots_') !== -1) {
            const type = item.slice(10);
            msgPrefix = (__[type] !== undefined ? __[type] : type) + __.snapshot;
          } else {
            msgPrefix = __[item] !== undefined ? __[item] : item;
          }
      }

      result.errorMessage = msgPrefix + __.quota_total_less_than_used;
      return result;
    }
  }

  const {
    numberChanged,
    gigabyteChanged,
    snapshotChanged
  } = isVolumeFieldChanged(quota, volumeTypes);

  if(numberChanged) {
    const totalLegal = checkVolumeTotalLegality(quota, 'volumes');

    if(!totalLegal) {
      result.status = 'fail';
      result.errorMessage = __.volumes_small_than_total;
      return result;
    }
  }

  if(gigabyteChanged) {
    const totalGigaLegal = checkVolumeTotalLegality(quota, 'gigabytes');

    if(!totalGigaLegal) {
      result.status = 'fail';
      result.errorMessage = __.gigabytes_small_than_total;
      return result;
    }
  }

  if(snapshotChanged) {
    const totalSnapshotLegal = checkVolumeTotalLegality(quota, 'snapshots');

    if(!totalSnapshotLegal) {
      result.status = 'fail';
      result.errorMessage = __.snapshots_small_than_total;
      return result;
    }
  }

  return result;
}

module.exports = {
  checkVolumeTotalLegality: checkVolumeTotalLegality,
  quotaValidate: quotaValidate
};
