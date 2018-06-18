pragma solidity 0.4.24;

import "./PPF.sol";
import "./IPPFFactory.sol";


contract PPFFactory is IPPFFactory {
    function newPPF(address operator, address operatorOwner) external returns (IFeed) {
        return IFeed(new PPF(operator, operatorOwner));
    }
}