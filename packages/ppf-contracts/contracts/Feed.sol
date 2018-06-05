pragma solidity 0.4.24;

interface Feed {
    function get(address base, address quote) external view returns (uint128 xrt, uint64 when);
}
