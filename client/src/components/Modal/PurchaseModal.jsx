/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import useAuth from "../../hooks/useAuth";
import Button from "../Shared/Button/Button";
import toast from "react-hot-toast";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  // Total Price Calculation
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const { name, category, image, description, price, quantity, _id, seller } =
    plant || [];
  const [quantityTotal, setTotalQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);
  const [purchase, setPurchase] = useState({
    customer: {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    },
    Plant_id: _id,
    quantity: quantityTotal,
    price: totalPrice,
    seller: seller?.email,
    address: "",
    status: "pending",
  });

  const handleQuantity = (value) => {
    const priceInt = parseInt(price);
    if (value > quantity) {
      setTotalQuantity(quantity);
      return toast.error("Quantity is not available");
    }
    if (value < 0) {
      setTotalQuantity(1);
      return toast.error("Quantity cannot be less than 1");
    }
    setTotalQuantity(value);
    setTotalPrice(value * priceInt);
    setPurchase((prv) => {
      return { ...prv, quantity: value, price: value * priceInt };
    });
  };

  console.log(quantityTotal, _id)

  const handlePurchase = async () => {
    try {
      await axiosSecure.post(`/order`, purchase);
      const {data} =await axiosSecure.patch(`/order/quantity/${_id}`, {
        updateTotalQuantity: quantityTotal,
        status:'decrease'
      });
      console.log(data)
      refetch()
      toast.success("order successfully");
    } catch (err) {
      console.log(err);
    } finally {
      closeModal();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {price}</p>
                </div>
                <p className="text-sm text-gray-500">
                  Available quantity {quantity}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-gray-500">Quantity</p>
                  <input
                    className="px-4 py-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="quantity"
                    id="quantity"
                    type="number"
                    placeholder="quantity"
                    required
                    defaultValue={quantityTotal}
                    onChange={(e) => handleQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-sm text-gray-500">Address</p>
                  <input
                    className="px-4 py-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="address"
                    id="address"
                    type="text"
                    placeholder="address"
                    required
                    onChange={(e) =>
                      setPurchase((prv) => {
                        return { ...prv, address: e.target.value };
                      })
                    }
                  />
                </div>
                <div className="mt-3">
                  <Button
                    onClick={handlePurchase}
                    label={`Pay${totalPrice}$`}
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
