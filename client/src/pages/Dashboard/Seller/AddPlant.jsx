import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imgUpload } from "../../../api/Utils";
import useAuth from "../../../hooks/useAuth";
import { useState } from "react";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import toast from "react-hot-toast";

const AddPlant = () => {
  const [uploadBtnText, setUploadBtnText] = useState({ img: {name: "Upload Button"} });
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const handleFrom = async (e) => {
    setLoading(true)
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const category = form.category.value;
    const description = form.description.value;
    const price = parseInt(form.price.value);
    const quantity = parseInt(form.quantity.value);
    const image = form.image.files[0];
    const imgData = await imgUpload(image);
    const seller = {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    };
    const plantData = {
      image: imgData,
      seller,
      name,
      category,
      description,
      price,
      quantity,
    };
    try {
      const { data } = await axiosSecure.post("/plant", plantData);
      console.log(data);
      form.reset();
      toast.success('Data Added Successfully')
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        handleFrom={handleFrom}
        setUploadBtnText={setUploadBtnText}
        uploadBtnText={uploadBtnText}
        loading={loading}
      />
    </div>
  );
};

export default AddPlant;
